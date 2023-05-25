
.PHONY: all clean

all: default.css layout.css projector.css

%.css : %.scss
	sassc $< $@

clean:
	-rm *.css *.map
