#!/bin/bash -x

remote=$1
head=$(git rev-parse HEAD)

make
git clone . _deploy
rsync -r --exclude=.git --exclude=org-mode \
      --exclude=htmlize --exclude=_deploy \
      --exclude=MathJax/fonts \
      --exclude=MathJax/unpacked \
      --exclude=MathJax/jax/output/SVG \
      --exclude=MathJax/jax/output/HTML-CSS \
      . _deploy

# trap "cd $(pwd); rm -r _deploy" EXIT
# trap "git reset $head" EXIT
# trap "popd; rm -r _deploy" INT

pushd _deploy

git checkout --detach
touch .nojekyll
git add -f --all
git add -f MathJax
git commit -q -m "Deployed $(date)"
git tag deploy-$(date +%Y%m%d%H%M)
git push -f $remote HEAD:refs/heads/gh-pages

# git@github.com:user/repo

echo $remote | sed 's_[:/]_ _g' | awk '{print "https://"$2".github.io/"$3}'
