# Production image for WashRewards SA — one image, three run modes:
#   - default (this file's CMD): nginx + php-fpm, for the API/admin ECS service
#   - `php artisan queue:work ...`: overridden as the queue worker task's command
#   - `php artisan schedule:run`: overridden as the scheduled task's command
# See infra/modules/ecs for how each task definition picks its command.

FROM composer:2 AS vendor

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --no-autoloader \
    --ignore-platform-reqs

COPY . .
RUN composer dump-autoload --optimize --no-dev

FROM php:8.4-fpm-alpine AS app

RUN apk add --no-cache $PHPIZE_DEPS \
    && apk add --no-cache \
        nginx \
        supervisor \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        libzip-dev \
        icu-dev \
        oniguruma-dev \
        curl-dev \
    && docker-php-ext-configure gd --with-jpeg --with-freetype \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql \
        mbstring \
        bcmath \
        gd \
        zip \
        intl \
        exif \
        pcntl \
        opcache \
    && pecl install redis \
    && docker-php-ext-enable redis
    # Deliberately not `apk del`-ing the -dev packages here: on Alpine that
    # can strip the runtime .so files the compiled extensions (gd, zip,
    # intl...) need, since apk doesn't track that dependency. Costs some
    # image size; a broken image in production costs a lot more.

RUN { \
        echo 'opcache.enable=1'; \
        echo 'opcache.validate_timestamps=0'; \
        echo 'opcache.memory_consumption=192'; \
        echo 'opcache.max_accelerated_files=20000'; \
        echo 'opcache.interned_strings_buffer=16'; \
    } > /usr/local/etc/php/conf.d/opcache-production.ini

WORKDIR /var/www/html

COPY --from=vendor /app /var/www/html

COPY docker/production/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/production/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
