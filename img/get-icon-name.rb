#!/usr/bin/env ruby

src = open("i2icons").readlines
dst = open("xx","w")

#-rw-rw-r-- 1 admin admin  2102 Dec 26 18:41 aircraft carrier.bmp
#-rw-rw-r-- 1 admin admin  2102 Dec 26 18:41 airfield.bmp

src.each do |l|
  f = l.chomp.split(' ')
  len = f.size
  on = f[8..len].join(' ').gsub(/\ /,'\ ').gsub(/\(/,'\(').gsub(/\)/,'\)')
  fn = f[8..len].join('-').tr('(','').tr(')','')
  if (fn != on)
    cmd = "mv #{on} #{fn}"
    system(cmd)
  end
end
  
