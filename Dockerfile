FROM nginx
RUN rm /etc/nginx/conf.d/default.conf
COPY html /usr/share/nginx/html
COPY conf/nginx.conf /etc/nginx/conf.d/
EXPOSE 3510 443
ENTRYPOINT nginx -g 'daemon off;' 

#RUN ln -s usr/local/bin/docker-entrypoint.sh /

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
