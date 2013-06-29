#!/usr/local/rvm/bin/ruby

=begin

dst: i2icon4
['a001','aircraft-carrier'],['a002','airfield'] ]

src: i2icon3
a001|aircraft-carrier.bmp
a002|airfield.bmp
a003|ambush.bmp
a004|anbchart.bmp

=end

src = open("i2icon3").readlines
dst = open("i2icon4","w")

n = 0
src.each do |l|
  n += 1
  f = l.chomp.split('|')
  if (n % 4 == 1)
    if n == 1
      dst.write("['#{f[0]}','#{f[1].gsub(/.bmp/,'')}'],") 
    else
      dst.write("\n['#{f[0]}','#{f[1].gsub(/.bmp/,'')}'],") 
    end
  else
    dst.write("['#{f[0]}','#{f[1].gsub(/.bmp/,'')}'],") 
  end
end

dst.close

