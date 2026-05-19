# flake8: noqa
# Apache License
# Version 2.0, January 2004
# http://www.apache.org/licenses/
#
# TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION
#
# Copyright [yyyy] [name of copyright owner]
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import threading

__package_name__ = "openspg-kag"
__version__ = "0.8.0"

_runtime_lock = threading.Lock()
_runtime_modules_registered = False
_builder_modules_registered = False


def ensure_runtime_initialized(config_file=None, include_builder=False):
    """Initialize KAG configuration and register built-in runtime modules lazily."""
    global _runtime_modules_registered, _builder_modules_registered

    try:
        from kag.common.conf import init_env
    except ModuleNotFoundError as exc:
        if exc.name and exc.name.startswith("knext"):
            raise ModuleNotFoundError(
                "KAG runtime dependency 'knext' is missing. Install the KAG/OpenSPG "
                "dependencies before invoking build, index, or QA features."
            ) from exc
        raise

    init_env(config_file)
    with _runtime_lock:
        if not _runtime_modules_registered:
            try:
                import kag.interface
                import kag.interface.solver.execute
                import kag.interface.solver.plan
                import kag.builder.runner
                import kag.builder.prompt
                import kag.solver.prompt
                import kag.common.vectorize_model
                import kag.common.rerank_model
                import kag.common.llm
                import kag.common.rate_limiter
                import kag.common.checkpointer
                import kag.solver
                import kag.common.tools
                import kag.indexer
            except ModuleNotFoundError as exc:
                if exc.name and exc.name.startswith("knext"):
                    raise ModuleNotFoundError(
                        "KAG runtime dependency 'knext' is missing. Install the KAG/OpenSPG "
                        "dependencies before invoking build, index, or QA features."
                    ) from exc
                raise
            _runtime_modules_registered = True

        if not include_builder or _builder_modules_registered:
            return
        try:
            import kag.builder.component
            import kag.builder.default_chain
        except ModuleNotFoundError as exc:
            if exc.name and exc.name.startswith("knext"):
                raise ModuleNotFoundError(
                    "KAG runtime dependency 'knext' is missing. Install the KAG/OpenSPG "
                    "dependencies before invoking build, index, or QA features."
                ) from exc
            raise
        _builder_modules_registered = True
