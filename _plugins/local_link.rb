module Jekyll
  class LocalLink < Liquid::Tag

    require "shellwords"

    def initialize(tag_name, text, tokens)
      super
      @text = text.shellsplit
    end

    def render(context)
      "<a href=\"#{@text[0]}\" class=\"link-live has-content spawns-popup\" data-link-icon-type=\"text\" data-link-icon=\"𝔊\" data-attribute-title=\"Explanation of 'importance' metadata: rating 1–10 about how much a topic matters to the world.\" style=\"\">#{@text[1]}</a>"
    end
    
   
    #def render(context)
    #  "<label for='#{@text[0]}' class='margin-toggle sidenote-number'></label><input type='checkbox' id='#{@text[0]}' class='margin-toggle'/><span class='sidenote'>#{@text[1]} </span>"
    #end

  end
end

Liquid::Template.register_tag('locallink', Jekyll::LocalLink)

