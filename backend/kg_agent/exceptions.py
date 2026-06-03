class EightDIntegrationError(Exception):
    """8D integration facade HTTP or contract error."""

    def __init__(self, message: str, *, code: str = "", trace_id: str = "", status_code: int = 502):
        super().__init__(message)
        self.code = code
        self.trace_id = trace_id
        self.status_code = status_code
