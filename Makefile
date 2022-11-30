
export GH_DOMAIN  = git@github.com
export GH_USER    = guicho271828
export EMACS      = emacs
export EMACSFLAGS =

export ncpu       = $(shell grep "processor" /proc/cpuinfo | wc -l)

.PHONY: auto all img scripts clean allclean html index css deploy
.SECONDLY: *.elc *.org.*

%.org.html: %.org scripts .submodules
	scripts/org-html.sh $< $@

all: index
html: img css presen.org.html .submodules

deploy: index
	+scripts/deploy.sh $(GH_DOMAIN):$(GH_USER)/$$(basename $$(readlink -ef .)).git

index: html
	cp -f presen.org.html index.html

.submodules:
	git submodule update --init --recursive
	$(MAKE) -C org-mode compile
	touch .submodules

scripts:
	$(MAKE) -C scripts

auto:
	scripts/make-cycle.sh -j $(ncpu) all

img:
	$(MAKE) -C img
css:
	$(MAKE) -C css

presen.org: head.org
	touch presen.org

clean:
	-rm *~ *.html *.elc

allclean: clean
	git clean -Xfd
	$(MAKE) -C scripts clean
	$(MAKE) -C img clean
	$(MAKE) -C css clean

archive: index
	scripts/inline-html.ros index.html > index-single.html
