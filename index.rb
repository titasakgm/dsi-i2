#!/usr/local/rvm/rubies/ruby-1.9.3-p194/bin/ruby
# coding: utf-8

require 'cgi'

c = CGI::new
user = c['user']

if user.length == 0
  system("cp dsi.tpl dsi.js")
end

print "Content-type: text/html\n\n"

h = open("index.html.ORIG").readlines
h.each do |l|
  print l
end

