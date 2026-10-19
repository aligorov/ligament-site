FROM nginx:alpine

# Remove default nginx configs
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copy security headers into /etc/nginx/ (NOT conf.d, avoiding auto-include conflicts)
COPY security-headers.conf /etc/nginx/security-headers.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static website files
COPY *.html styles.css site.js robots.txt sitemap.xml /usr/share/nginx/html/
COPY en/ /usr/share/nginx/html/en/
COPY assets/ /usr/share/nginx/html/assets/

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
