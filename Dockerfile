FROM nginx:alpine

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copy security headers snippet & nginx server block
COPY security-headers.conf /etc/nginx/conf.d/security-headers.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static website files
COPY index.html styles.css site.js robots.txt sitemap.xml /usr/share/nginx/html/
COPY en/ /usr/share/nginx/html/en/
COPY assets/ /usr/share/nginx/html/assets/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
