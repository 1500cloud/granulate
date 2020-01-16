# granulate

A web worker library for turning media files into grains.

This library is free software; you can redistribute it and/or modify it under
the terms of the GNU Lesser General Public License as published by the Free
Software Foundation; either version 2.1 of the License, or (at your option)
any later version.

This library is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE. See the [GNU Lesser General Public License](LICENSE)
for more details.

This library uses the code of [FFmpeg](https://www.ffmpeg.org) also licensed
under the GNU Lesser General Purpose License.

Usage
-----

* In order to comply with the license, please include attribution:
  This software uses code of [FFmpeg](https://www.ffmpeg.org) and 
  [Granulator](https://github.com/1500cloud/granulator) licensed under the
  [LGPLv2.1](http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html) and its
  source can be downloaded from https://github.com/1500cloud/granulator. 

Development
-----------

* You will need Docker and NodeJS installed in order to work on this code
  base.
* Run `npm install` (or `yarn`) to get all the necessary dependencies
* To build the WASM bundle, run `make`. This will probably take some time on
  first build.
* Run `yarn dev` to start ESLint code quality checks and running the test
  harness. Visit http://localhost:8080/test.html to view the test harness.
  Any changes to the JavaScript will automatically be rebuilt and you can
  reload the browser to view it. Any changes to the C code will need you to
  re-run `make` to rebuild the WASM bundle.