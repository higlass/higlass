.. _troubleshooting:

===========
Troubleshooting
===========

Empty Page
==========

HiGlass showing as an empty page in Firefox on Linux
----------------------------------------------------

Due to a bug in Mesa video drivers that has since been fixed, Firefox introduced a workaround which prevents HiGlass to load.
To disable this workaround, set ``gfx.work-around-driver-bugs=false`` in ``about:config``, and restart the browser.

Source: https://bugzilla.mozilla.org/show_bug.cgi?id=1601682
