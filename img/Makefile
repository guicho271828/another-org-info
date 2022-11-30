
.SECONDEXPANSION:

.PRECIOUS: %.png

.PHONY:	clean all

all: $(shell find -name "*.pdf" -o -name "*.svg" -o -name "*.png" -o -name "*.jpg" | sed -e "s/\(pdf\|png\|jpg\|svg\)/xbb/g")

%.xbb : %.jpg
	ebb -x $<

%.xbb : %.png
	ebb -x $<

%.png : %.svg
	inkscape -f $< -e $@ -d 150      2>/dev/null || \
		inkscape -o $@ -d 150 $< 2>/dev/null || \
		convert $< $@            2>/dev/null

%.png : %.pdf
	pdftoppm -png -rx 300 -ry 300 $< $*
	mv $*-1.png $@

clean:
	-find -name "*.xbb" -delete
	-rm *.png
