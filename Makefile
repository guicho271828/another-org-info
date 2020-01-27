
latexmk    = latexmk/latexmk.pl

GH_DOMAIN  = git@github.com
GH_USER    = asai-research-presentation
EMACS      = emacs
EMACSFLAGS =
styles     = sty/anorg.sty sty/user.sty

ncpu       = $(shell grep "processor" /proc/cpuinfo | wc -l)

.PHONY: auto all img scripts clean allclean html pdf index css deploy
.SECONDLY: *.elc *.org.*

%.pdf: %.tex presen.org.tex img $(styles)
	$(latexmk) -r latexmk/rc_ja.pl \
		   -latexoption="-halt-on-error" \
		   -pdfdvi \
		   -bibtex \
		   $<

%.org.tex: %.org scripts org-mode
	scripts/org-latex.sh $< $@

%.org.html: %.org scripts org-mode
	scripts/org-html.sh $< $@

all: index
html: img css presen.org.html MathJax
pdf:    key.pdf
nokey:  nokey.pdf

deploy: index
	+scripts/deploy.sh $(GH_DOMAIN):$(GH_USER)/$$(basename $$(readlink -ef .)).git

index: html
	cp -f presen.org.html index.html

get-archive = wget -O- $(1) | tar xz ; mv $(2) $(3)

MathJax:
	$(call get-archive, https://github.com/mathjax/MathJax/archive/2.6.1.tar.gz, MathJax-2.6.1, $@)

org-mode:
	$(call get-archive, http://orgmode.org/org-8.3.6.tar.gz, org-8.3.6, $@)
	$(MAKE) -C $@ compile

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

