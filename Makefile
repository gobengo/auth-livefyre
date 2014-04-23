.PHONY: all build

all: build

build: node_modules

dist: node_modules config
	./node_modules/requirejs/bin/r.js -o ./config/build.conf.js

# if package.json changes, install
node_modules: package.json
	npm install
	touch $@

test: build
	npm test

testw: build
	npm run testw

testp: build
	./node_modules/karma/bin/karma start --browsers=PhantomJS

testb: build
	./node_modules/karma/bin/karma start --browsers=Chrome

clean:
	rm -rf node_modules

package: build

run: server

server: build
	npm start
	
lint: build
	./node_modules/jshint/bin/jshint src
