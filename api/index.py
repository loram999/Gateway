import sys
import os

# Ensure parent directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from wave_gateway import flask_app

# Vercel looks for the variable named app
app = flask_app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
