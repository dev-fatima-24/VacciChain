FROM alpine:3.19

# Install AWS CLI and tzdata for cron timezone support
RUN apk add --no-cache aws-cli tzdata

WORKDIR /app
COPY backup.sh .
RUN chmod +x backup.sh

# Add crontab entry for daily midnight run
RUN echo "0 0 * * * /app/backup.sh >> /var/log/backup.log 2>&1" > /etc/crontabs/root

# Keep cron running in foreground
CMD ["crond", "-f", "-l", "2"]
