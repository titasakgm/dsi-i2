#!/usr/bin/env ruby

src = open("i2icon2").readlines
dst = open("i2icon3","w")

pre = nil
i = 0
src.each do |l|
  fn = l.chomp
  if pre == nil
    pre = fn[0..0]
    i += 1
    ix = sprintf("%03d",i)
  else
    if pre == fn[0..0] # same alphabet
      i += 1
      ix = sprintf("%03d",i)
    else # change alphabet
      pre = fn[0..0] # a -> b
      i = 1
      ix = sprintf("%03d",i)
    end
  end
  data = "#{pre}#{ix}|#{fn}\n"
  cmd = "convert #{fn} #{pre}#{ix}.png"
  system(cmd)
  dst.write(data)
end

dst.close


