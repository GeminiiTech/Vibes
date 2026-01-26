from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from urllib.parse import parse_qs

from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError

from auth_service.models import Profile


class JWTAuthMiddleware(BaseMiddleware):
    """
    JWT authentication middleware for WebSocket connections.
    Extracts JWT token from query string and attaches user to scope.

    Usage: ws://host/ws/chat/1/?token=<jwt_access_token>
    """

    async def __call__(self, scope, receive, send):
        # Extract token from query string
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]

        if token:
            scope["user"] = await self.get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def get_user_from_token(self, token):
        """Validate JWT token and return associated user."""
        try:
            access_token = AccessToken(token)
            user_id = access_token.get("user_id")

            if user_id:
                return Profile.objects.get(id=user_id)
        except (TokenError, Profile.DoesNotExist):
            pass

        return AnonymousUser()
