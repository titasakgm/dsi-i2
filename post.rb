#!/usr/local/rvm/rubies/ruby-1.9.3-p194/bin/ruby
# -*- encoding : utf-8 -*-

require 'net/http'

kml = File.open("kml/test.kml","rb").read
data = "user=admin&pass=1234&case_id=case01&kml=#{kml}"

url = URI.parse('http://203.151.201.129/i2/kml.rb')
http = Net::HTTP.new(url.host, url.port)
response, body = http.post(url.path, data, {'Content-type'=>'text/html'})

print "Location:http://203.151.201.129/i2\n\n"
