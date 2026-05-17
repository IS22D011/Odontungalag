# import smtplib
# from email.mime.multipart import MIMEMultipart
# from email.mime.text import MIMEText
# from email.utils import formataddr

# def send_verification_email(recipient, subject, body_html):
#     sender_email = "testmail@mandakh.edu.mn"
#     sender_name = "Mandakh Registration"
#     sender_password = "Mandakh2" 
    
#     msg = MIMEMultipart()
#     msg['From'] = formataddr((sender_name, sender_email))
#     msg['To'] = recipient
#     msg['Subject'] = subject
#     msg.attach(MIMEText(body_html, 'html'))

#     try:
#         # 1. smtp.office365.com нь smtp-mail.outlook.com-оос илүү тогтвортой
#         with smtplib.SMTP('smtp.office365.com', 587) as server:
#             server.ehlo()  # Серверт өөрийгөө танилцуулах (ЧУХАЛ)
#             server.starttls() # Холболтыг нууцлах
#             server.ehlo()  # TLS-ийн дараа дахин танилцуулах
#             server.login(sender_email, sender_password)
#             server.sendmail(sender_email, recipient, msg.as_string())
#             print(f"Имэйл {recipient} руу амжилттай илгээгдлээ!")
#             return True
#     except Exception as e:
#         print(f"Имэйл илгээхэд алдаа гарлаа: {e}")
#         return False


import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def send_verification_email(recipient, subject, body_html):
    sender_email = "odontungalagb9@gmail.com"  
    sender_password = "fzqm xaxm nqwa jlnl" 
    
    msg = MIMEMultipart()
    msg['From'] = f"Бүртгэлийн систем <{sender_email}>"
    msg['To'] = recipient
    msg['Subject'] = subject
    msg.attach(MIMEText(body_html, 'html'))

    try:
        # Gmail-ийн SMTP сервер: smtp.gmail.com, Порт: 587
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls() # Холболтыг нууцлах
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, recipient, msg.as_string())
            print(f"Gmail-ээр {recipient} руу амжилттай илгээгдлээ!")
            return True
    except Exception as e:
        print(f"Gmail илгээхэд алдаа гарлаа: {e}")
        return False