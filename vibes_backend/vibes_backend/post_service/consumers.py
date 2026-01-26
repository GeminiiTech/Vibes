import json
from channels.generic.websocket import AsyncWebsocketConsumer

class PostsConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        # All users join the "posts" group
        await self.channel_layer.group_add("posts", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Remove user from group
        await self.channel_layer.group_discard("posts", self.channel_name)

    # Receive message from group_send
    async def post_update(self, event):
        await self.send(text_data=json.dumps(event))
