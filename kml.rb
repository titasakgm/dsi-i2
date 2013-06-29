#!/usr/local/rvm/rubies/ruby-1.9.3-p194/bin/ruby
# coding: utf-8

require 'cgi'

def update_dsi(user)
  # Get all .kml for this user
  user_kmls = []
  ff = Dir.entries("/kml")
  ff.each do |f|
    # insert kml to user_kmls if filename start with username and - (e.g. admin-) 
    # and has extension .kml
    user_kmls.push(f) if f =~ /^#{user}-/ and f =~ /\.kml$/ 
  end

  src = open("dsi.tpl","r:utf-8").readlines
  dst = open("dsi.js","w:utf-8")
  src.each do |l|
    if l =~ /INSERTUSERKML/
       dst.write(l)
       user_kmls.each do |kml|
         dst.write("    create_layer_kml('/kml/#{kml}');")
       end
       next
    end
    dst.write(l)
  end
  dst.close
end

c = CGI::new
user = c.params['user'][0].to_s
pass = c.params['pass'][0].to_s
case_id = c.params['case_id'][0].to_s
kml = c.params['kml'][0].to_s

File.open("/kml/#{user}-#{case_id}.kml","w").write(kml)

# Change //INSERTUSERKML// to create_layer_kml("/kml/#{user}-#{case_id}.kml")
update_dsi(user)
