
.SECONDEXPANSION:

.PRECIOUS: %.png

.PHONY:	clean all

all: $(shell find -name "*.pdf" -o -name "*.svg" -o -name "*.png" -o -name "*.jpg" | sed -e "s/\(pdf\|png\|jpg\|svg\)/xbb/g")

%.xbb : %.jpg
	ebb -x $<

%.xbb : %.png
	ebb -x $<

%.png : %.svg
# support newer inkscape
	inkscape -f $< -e $@ -d 150 || inkscape -o $@ -d 150 $<
#	convert $< $@
#	if you want to use imagemagick, comment out 'inkscape...' and use 'convert...'

%.png : %.pdf
	convert $< $@

clean:
	-find -name "*.xbb" -delete
	-rm *.png
