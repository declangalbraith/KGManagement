from django.apps import AppConfig

class KagConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'kag'
    verbose_name = 'KAG Knowledge Graph'

    def ready(self):
        pass
