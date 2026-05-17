import requests
import json

def send_push_notification(tokens, title, body, data=None):
    # Expo эсвэл Firebase-ийн токен руу илгээх логик
    url = "https://exp.host/--/api/v2/push/send" # Expo ашиглаж байгаа бол
    
    messages = []
    for token in tokens:
        if token: # Токен хоосон биш бол
            messages.append({
                "to": token,
                "sound": "default",
                "title": title,
                "body": body,
                "data": data or {}
            })
            
    if messages:
        response = requests.post(url, json=messages)
        return response.json()