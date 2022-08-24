#!/bin/bash

EMACS=${EMACS:-emacs}

in=$(readlink -ef $1)
out=$(readlink -ef $2)
cd $(dirname $(readlink -ef $0))
$EMACS --batch --quick --eval "(progn (load-file \"compile-org-html.el\")(compile-org \"$in\" \"$out\"))"

