from django.apps import AppConfig


class KagConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "kag"
    verbose_name = "KAG Knowledge Graph"

    def ready(self):
        from .config import bootstrap_knext_env

        bootstrap_knext_env()
