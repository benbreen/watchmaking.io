# Param 1: Path to Gallary
# Param 2: (optional) - specify 'full-width' to use the full width (including margin)

# Needs gallery.css

# Based on: https://dmnfarrell.github.io/software/jekyll-galleries
# Another useful ruby example: https://stackoverflow.com/questions/67659861/how-to-bundle-multiple-static-files-as-zip-archive-for-download
# and https://github.com/ggreer/jekyll-gallery-generator/blob/master/lib/jekyll-gallery-generator.rb
# Handcoded by Ben

module Jekyll

    GalleryImage = Struct.new(:name, :url, :thumb_url)
    class Gallery < Liquid::Tag
  
      require "shellwords"
  
      def initialize(tag_name, text, tokens)
        super
        @text = text.shellsplit
      end

    def render(context)
      css = "image-gallery"
      if @text.length >= 2 and @text[1].strip.downcase == "full-width"
        css = "image-gallery-full-width"
      end

      site = context.registers[:site]
      images = Array.new
      site.static_files.each do |sfile|
         if sfile.path.include? @text[0] and !sfile.path.include? "/thumbs/"
          if sfile.extname == '.png' || sfile.extname == '.jpg' || sfile.extname == '.jpeg'
            img = GalleryImage.new
            folder = sfile.relative_path.gsub(sfile.name, "")
            img.thumb_url = folder + "thumbs/" + sfile.name + "\n"
            img.url = sfile.relative_path
            img.name = sfile.basename
            images.push img
          end
         end
      end

      outhtml = ""
      if !images.empty?
        #STDERR.puts images
        #STDERR.puts "------------"
        # Sort files naturally by number if the filename contains a number, then by strings
        images.sort_by! do |i|
          if i.name =~ /\d+/
            [1, i.name[/\d+/].to_i]
          else
            [2, i.name]
          end
        end
        #STDERR.puts images
        outhtml << %Q[<div class ="#{css}">]
          images.each do |image|
            outhtml << %Q[<div class="gallery-box"><a href="#{image.url}" class="no-popin" title="#{image.name}"><img src="#{image.thumb_url}" alt="#{image.name}"  class="img-gallery" /> </a></div>]
          end
        outhtml << %Q[</div>>]
      end
      outhtml
    end


      def rendery(context)
        
        <<-eox
<div class ="image-gallery">
{% assign sorted = site.static_files | sort: 'date' | reverse %}
{% for file in sorted %}
<!--<a>file.path</a>-->
{% if file.path contains "#{@text[0]}" %}
{% if file.extname == '.png' or file.extname == '.jpg' or file.extname == '.jpeg' %}
{% assign filenameparts = file.path | split: "/" %}
{% assign filename = filenameparts | last | replace: file.extname,"" %}
{% assign filefolder = file.path | replace: file.name, "" %}
<div class="box"><a href="{{ file.path | relative_url }}" title="{{ filename }}">
<img src="{{ filefolder }}thumbs/{{file.name }} " alt="{{ filename }}"  class="img-gallery" />
</a></div>
{% endif %}
{% endif %}
{% endfor %}
    </div>
        eox
      end

      def xrender(context)
        <<-eox
        <div class ="image-gallery">
            {% assign sorted = site.static_files | sort: 'date' | reverse %}
            {% for file in sorted %}
            <!--<a>file.path</a>-->
                {% if file.path contains "#{@text[0]}" %}
                    {% if file.extname == '.png' or file.extname == '.jpg' or file.extname == '.jpeg' %}
                        {% assign filenameparts = file.path | split: "/" %}
                        {% assign filename = filenameparts | last | replace: file.extname,"" %}
                        {% assign filefolder = file.path | replace: file.name, "" %}
                        <div class="box"><a href="{{ file.path | relative_url }}" title="{{ filename }}">
                            <img src="{{ filefolder }}thumbs/{{file.name }} " alt="{{ filename }}"  class="img-gallery" />
                        </a></div>
                    {% endif %}
                {% endif %}
            {% endfor %}
        </div>
         eox
      end
      

    end
  end
  
  Liquid::Template.register_tag('gallery', Jekyll::Gallery)
  
  