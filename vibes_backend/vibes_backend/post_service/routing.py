from django.urls import path
from .consumers import PostsConsumer

websocket_urlpatterns = [
    path("ws/posts/", PostsConsumer.as_asgi()),
]
