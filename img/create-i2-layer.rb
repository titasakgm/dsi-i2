#!/usr/local/rvm/bin/ruby

=begin

dst: i2icon5
    ,'layer_a001': {
                  'backgroundGraphic': 'img/a001.bmp'
                  ,'backgroundWidth': 27
                  ,'backgroundHeight': 27
                  ,'backgroundYOffset': -27
                }

src: i2icon3
a001|aircraft-carrier.bmp
a002|airfield.bmp
a003|ambush.bmp
a004|anbchart.bmp

=end

src = open("i2icon3").readlines
dst = open("i2icon5","w")

src.each do |l|
  f = l.chomp.split('|')
  str =  "    ,'layer_#{f[0]}': {\n"
  str += "                  'backgroundGraphic': 'img/#{f[0]}.bmp'\n"
  str += "                  ,'backgroundWidth': 27\n"
  str += "                  ,'backgroundHeight': 27\n"
  str += "                  ,'backgroundYOffset': -27\n"
  str += "                }\n"
  dst.write(str)
end

dst.close
