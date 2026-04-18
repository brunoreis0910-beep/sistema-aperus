# -*- coding: utf-8 -*-
import logging

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger('api.requests')

    def __call__(self, request):
        # Log antes de processar
        if '/compras/' in request.path:
            self.logger.info("=" * 100)
            self.logger.info(f"REQUEST RECEBIDO: {request.method} {request.path}")
            self.logger.info(f"Content-Type: {request.content_type}")
            self.logger.info(f"Headers: {dict(request.headers)}")
            if request.method == 'POST':
                self.logger.info(f"POST Data: {request.POST}")
                self.logger.info(f"FILES: {list(request.FILES.keys())}")
            self.logger.info("=" * 100)

        response = self.get_response(request)

        # Log depois de processar
        if '/compras/' in request.path:
            self.logger.info(f"RESPONSE: {response.status_code}")
            if hasattr(response, 'data'):
                self.logger.info(f"Response Data: {response.data}")
            self.logger.info("=" * 100)

        return response
