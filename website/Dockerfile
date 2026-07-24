# Public marketing site (static index.html + contact.php form handler) —
# served on the apex/www domain, separate ECS service from the Laravel app
# so a site content change never requires redeploying the API. See
# infra/modules/website for the ALB host-header routing that sends
# washrewards.online / www.washrewards.online here.

FROM php:8.4-fpm-alpine

RUN apk add --no-cache nginx supervisor

WORKDIR /var/www/html

COPY index.html contact.php ./
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN chown -R www-data:www-data /var/www/html

EXPOSE 80

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
