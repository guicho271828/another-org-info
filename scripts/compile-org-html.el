
(add-to-list 'load-path (concat default-directory "../org-mode/lisp/"))
(add-to-list 'load-path (concat default-directory "../org-mode/contrib/lisp/"))
(add-to-list 'load-path (concat default-directory "../emacs-htmlize/"))

(require 'ox-html)
(require 'org-table)
(defun compile-org (in out)
  (require 'ox-html)
  (require 'org-table)
  (org-version nil t t)
  (require 'htmlize)
  ;; (font-lock-mode)
  (custom-set-faces 
   '(default                      ((t (:foreground "#ffffff" :background "black"))))
   '(font-lock-builtin-face       ((t (:foreground "dark slate blue"))))
   '(font-lock-comment-face       ((t (:foreground "Firebrick"))))
   '(font-lock-constant-face      ((t (:foreground "dark cyan"))))
   '(font-lock-function-name-face ((t (:foreground "Blue1"))))
   '(font-lock-keyword-face       ((t (:foreground "purple"))))
   '(font-lock-string-face        ((t (:foreground "VioletRed4"))))
   '(font-lock-type-face          ((t (:foreground "ForestGreen"))))
   '(font-lock-variable-name-face ((t (:foreground "sienna"))))
   '(font-lock-warning-face       ((t (:foreground "red" :weight bold)))))
  (find-file in)
  (setq ;; htmlize-use-rgb-map 'force
        org-html-with-latex 'verbatim) ;; force verbatim so that custom mathjax config can be loaded
  (org-html-export-as-html nil nil nil nil)
  (write-file out))
