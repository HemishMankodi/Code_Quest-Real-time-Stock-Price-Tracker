from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import yfinance as yf
import smtplib
from email.mime.text import MIMEText
import time

app = Flask(__name__)
app.secret_key = 'Amreli@12345'  # Use a strong secret key for production

# Sample user data
users = {
    'admin': 'password'  # Replace with your desired username and password
}

# Price alert configuration
price_alerts = [
    {'ticker': 'AAPL', 'alert_price': 250.0, 'email': 'hemishmankodi@example.com'}  # Set your email here
]

def send_email(ticker, current_price):
    msg = MIMEText(f'The stock price of {ticker} has reached ${current_price}.')
    msg['Subject'] = f'Price Alert for {ticker}'
    msg['From'] = 'your_email@example.com'
    msg['To'] = 'your_email@example.com'  # Change to your recipient email

    # Send the email
    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login('your_email@example.com', 'your_email_password')  # Use your email and password
        server.send_message(msg)

def check_price_alerts():
    while True:
        for alert in price_alerts:
            ticker = alert['ticker']
            current_price = yf.Ticker(ticker).history(period='1d')['Close'].iloc[-1]
            if current_price >= alert['alert_price']:
                send_email(ticker, current_price)
                # Optionally, remove alert after sending
                # price_alerts.remove(alert)
        time.sleep(60)  # Check every minute

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if username in users and users[username] == password:
            session['username'] = username
            return redirect(url_for('index'))  # Redirect to the main page
        else:
            flash('Invalid username or password!')
    return render_template('login.html')  # Show the login form

@app.route('/logout')
def logout():
    session.pop('username', None)  # Remove user from session
    return redirect(url_for('login'))

@app.route('/')
def index():
    if 'username' in session:
        return render_template('index.html', price_alerts=price_alerts)  # Pass price_alerts to template
    else:
        return redirect(url_for('login'))  # Redirect to login if not authenticated

@app.route('/get_stock_data', methods=['POST'])
def get_stock_data():
    ticker = request.get_json()['ticker']
    data = yf.Ticker(ticker).history(period='1y')
    return jsonify({'currentPrice': data.iloc[-1].Close,
                    'openPrice': data.iloc[-1].Open})

if __name__ == '__main__':
    import threading
    # Start the price alert checker in a separate thread
    alert_thread = threading.Thread(target=check_price_alerts, daemon=True)
    alert_thread.start()
    app.run(debug=True)
