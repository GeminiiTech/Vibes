import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vibes_backend.settings')

# Initialize Django ASGI application early to ensure apps are loaded
from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application()

# Import channels components after Django is set up
from channels.routing import ProtocolTypeRouter, URLRouter

import post_service.routing
import chat_service.routing
from chat_service.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(
            post_service.routing.websocket_urlpatterns +
            chat_service.routing.websocket_urlpatterns
        )
    ),
})
