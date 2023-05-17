FROM node:20.1.0-alpine3.17

RUN apk add glances
RUN apk add neovim
RUN apk add fish
RUN apk add tmux
RUN apk add --force-overwrite tmuxinator
RUN apk add curl


WORKDIR /root
COPY ./configs/tmux/.tmux.conf .
COPY ./configs/tmux/.tmuxinator.yml ./.config/tmuxinator/repl.yml

WORKDIR /workdir

ENV NODE_PATH="/workdir:/workdir/node_modules"
ENV EDITOR=nvim
ENV SHELL=fish

ENTRYPOINT tmuxinator start repl
