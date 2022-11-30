
latexmk    = latexmk/latexmk.pl

export GH_DOMAIN  = git@github.com
export GH_USER    = guicho271828
export EMACS      = emacs
export EMACSFLAGS =
styles     = sty/anorg.sty sty/user.sty

export ncpu       = $(shell grep "processor" /proc/cpuinfo | wc -l)

.PHONY: auto all img scripts clean allclean html pdf index css deploy
.SECONDLY: *.elc *.org.*

%.pdf: %.tex presen.org.tex img $(styles)
	$(latexmk) -r latexmk/rc_ja.pl \
		   -latexoption="-halt-on-error" \
		   -pdfdvi \
		   -bibtex \
		   $<

%.org.tex: %.org scripts .submodules
	scripts/org-latex.sh $< $@

%.org.html: %.org scripts .submodules
	scripts/org-html.sh $< $@

all: index
html: img css presen.org.html .submodules
pdf:    key.pdf
nokey:  nokey.pdf

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
	-rm *~ *.org.* *.pdf \
		*~ *.aux *.dvi *.log *.toc *.bbl \
		*.blg *.utf8 *.elc \
		*.fdb_latexmk __* *.fls *.mtc *.maf *.out index.html

allclean: clean
	git clean -Xfd
	$(MAKE) -C scripts clean
	$(MAKE) -C img clean
	$(MAKE) -C css clean

archive: index
	scripts/inline-html.ros index.html > index-single.html
