import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ResultadoConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # ¡NUEVA LÓGICA DE AUTENTICACIÓN!
        # Gracias al middleware, self.scope['user'] ya está disponible.
        if self.scope['user'].is_anonymous:
            await self.close() # Rechaza la conexión si no está logueado
            return
            
        # --- El resto de tu código de conexión sigue igual ---
        self.competencia_id = self.scope['url_route']['kwargs']['competencia_id']
        self.competencia_group_name = f'competencia_{self.competencia_id}'

        # Unirse al grupo de la competencia
        await self.channel_layer.group_add(
            self.competencia_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Dejar el grupo de la competencia
        await self.channel_layer.group_discard(
            self.competencia_group_name,
            self.channel_name
        )

    # Recibir mensajes del WebSocket (ej. el Juez enviando puntajes)
    async def receive(self, text_data):
        # El Juez enviará un mensaje con el formato: 
        # { 'type': 'score_update', 'deportista_id': 10, 'puntaje': 95 }
        text_data_json = json.loads(text_data)

        # Aquí podrías agregar lógica para autenticar que quien envía es un Juez

        # Reenviar el mensaje a todos en el grupo
        await self.channel_layer.group_send(
            self.competencia_group_name,
            {
                'type': 'resultado_update', # El método que llamará abajo
                'data': text_data_json
            }
        )

    # Recibir mensajes del grupo y enviarlos al WebSocket (al cliente)
    async def resultado_update(self, event):
        # Enviar el mensaje directamente al cliente
        await self.send(text_data=json.dumps(event['data']))

    # Nota: La lógica para guardar en la BD se maneja mejor en una API de Django 
    # (por el Juez) y luego el Consumer solo se encarga de transmitir.