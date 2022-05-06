# Adapted from https://github.com/oturpe/jekyll-thumbnail-generator/blob/master/_plugins/thumbnail_generator.rb

require 'rmagick'
include Magick

module Jekyll
  class GenerateThumbnails < Generator
    safe true
    priority :low

    # default values
    Gallery_subdir = "galleries"
    Thumbnail_subdir = "thumbs"
    Thumbnail_size = { 'width' => 400, 'height' => 240 }

    attr_accessor :gallery_subdir, :thumbnail_size, :thumbnail_subdir

    def get_parameters!(site)
        @gallery_subdir = site.config['gallery_subdir'] || Gallery_subdir
        @thumbnail_size = site.config['thumbnail_size'] || Thumbnail_size
        @thumbnail_subdir = site.config['thumbnail_subdir'] || Thumbnail_subdir
    end

    def generate(site)
        # Get parameters or use defaults
        get_parameters! site
        STDERR.puts "Generating Thumbnails"
        # We need to track any new files we create (but not existing files we change or leave alone)
        # So we can tell Jekyll to add them to the site.
        new_files = []

        # Loop through every static file
        site.static_files.each do |sfile|

            # Not perfect, but probably a good enough test for this site.
            # Loop through each static file and check to see if the path includes the name of the
            # gallery dir, but also check it isn't in the thumbnails directory
            if sfile.path.include? gallery_subdir and !sfile.path.include? "/#{thumbnail_subdir}"
             # Check if the file is an image file
             if sfile.extname == '.png' || sfile.extname == '.jpg' || sfile.extname == '.jpeg'
                # Remove the filename to give the folder name in the form of c:\dir\dir\
                folder = sfile.path.gsub(sfile.name, "")
                # The thumbnail subdir and also the full path to the needed thumbnail
                thumb_folder = folder + "#{thumbnail_subdir}/"
                Dir.mkdir thumb_folder if not File.exists? thumb_folder
                thumb_path = thumb_folder + sfile.name
               if thumbnail_needed?(sfile.path, thumb_path, thumbnail_size)
                image = Image.read(sfile.path)[0]
                preexisting = File.exists? thumb_path
                save_thumbnail(image, thumb_path, thumbnail_size)
                if !preexisting
                    new_files.append([thumb_folder, sfile.name])
                end
               else
                  STDERR.puts "Skipping Thumbnail for File: " + [thumb_folder, sfile.name].inspect
              end  
            
            end
            else
                #STDERR.puts "No Match:#{sfile.path}:#{gallery_subdir}:/#{thumbnail_subdir}"
            end
         end
        
         new_files.each do |nfile|
            #STDERR.puts "New File:#{nfile[0]}:#{nfile[1]}"
            site.static_files << Jekyll::StaticFile.new(site, site.source, nfile[0].gsub(site.source, ""), nfile[1])
            
         end
    end

    def save_thumbnail(image, file, size)
        image.resize_to_fit! size['width'], size['height']
        STDERR.puts "Write File: " + file
        image.write file
    end

    def thumbnail_needed?(image_file, thumbnail_file, size)
        # No thumbnail yet?
        return true if not File.exists? thumbnail_file
        # Image has changed?
        return true if File.mtime(thumbnail_file) < File.mtime(image_file)

        # Need to resize?
        metadata = (Image.ping thumbnail_file)[0]
        existing_size = {
            'width' => metadata.columns,
            'height' => metadata.rows
        }

        return false if (
            size['width'] == existing_size['width'] and
            size['height'] >= existing_size['height']
        )
        return false if
            size['height'] == existing_size['height'] and
            size['width'] >= existing_size['width']

        true
    end

  end

end