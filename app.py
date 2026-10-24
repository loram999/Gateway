#!/usr/bin/env python3
"""
Wave Money Payment Gateway - Application Runner
Provides direct entry point for Flask WSGI or full Telegram + Flask runner.
"""
from wave_gateway import flask_app, main

app = flask_app

if __name__ == "__main__":
    main()
