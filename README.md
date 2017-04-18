# ezsystems/ezplatform-multi-file-upload
Allows uploading multiple files as new content items at once.

## Install

1. From your eZ Platform installation, run composer:

  ```sh
  $ composer require ezsystems/ezplatform-multi-file-upload
  ```

2. Enable the bundle by adding:

  ```php
  new EzSystems\MultiFileUploadBundle\EzSystemsMultiFileUploadBundle(),
  ```

  to `app/AppKernel.php`.

3. Setup routing by adding bundle configuration to `app/config/routing.yml`:

  ```yml
   _eZPlatformMultiFileUpload:
       resource: "@EzSystemsMultiFileUploadBundle/Resources/config/routing.yml"
       prefix:   "%ezpublish_rest.path_prefix%"
  ```

4. Clear cache and setup assets with `$ composer run-script post-update-cmd`

   *(if you use prod env make sure that it is set with `$ export SYMFONY_ENV=prod` first)*.


## Configuration
Example application configuration (`app/config/config.yml`):
```yml
# ...

ez_systems_multi_file_upload:
    location_mappings:
        -   # gallery
            content_type_identifier: gallery
            mime_type_filter:
                - video/*
                - image/*
            mappings:
                -   # images
                    mime_types:
                        - image/jpeg
                        - image/jpg
                        - image/pjpeg
                        - image/pjpg
                        - image/png
                        - image/bmp
                        - image/gif
                        - image/tiff
                        - image/x-icon
                        - image/webp
                    content_type_identifier: image  # content type of new items
                    content_field_identifier: image # field of content type to pass file to  
                    name_field_identifier: name     # field of content type to pass filename to
                -   # videos
                    mime_types:
                        - video/avi
                        - video/mpeg
                        - video/quicktime
                        - video/mp4
                        - video/webm
                        - video/3gpp
                        - video/x-msvideo
                        - video/ogg
                    content_type_identifier: video
                    content_field_identifier: file
                    name_field_identifier: name

    default_mappings:
        -   # file
            mime_types:
                - image/svg+xml
                - application/msword
                - application/vnd.openxmlformats-officedocument.wordprocessingml.document
                - application/vnd.ms-excel
                - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
                - application/vnd.ms-powerpoint
                - application/vnd.openxmlformats-officedocument.presentationml.presentation
                - application/pdf
            content_type_identifier: file
            content_field_identifier: file
            name_field_identifier: name

    fallback_content_type:
        content_type_identifier: file
        content_field_identifier: file
        name_field_identifier: name
```

Default bundle configuration:
```yml
parameters:
    ez_systems.multifile_upload.location_mappings: []

    ez_systems.multifile_upload.default_mappings:
        - # image
          mime_types:
            - image/jpeg
            - image/jpg
            - image/pjpeg
            - image/pjpg
            - image/png
            - image/bmp
            - image/gif
            - image/tiff
            - image/x-icon
            - image/webp
          content_type_identifier: image
          content_field_identifier: image
          name_field_identifier: name
        - # file
          mime_types:
            - image/svg+xml
            - application/msword
            - application/vnd.openxmlformats-officedocument.wordprocessingml.document
            - application/vnd.ms-excel
            - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
            - application/vnd.ms-powerpoint
            - application/vnd.openxmlformats-officedocument.presentationml.presentation
            - application/pdf
          content_type_identifier: file
          content_field_identifier: file
          name_field_identifier: name

    ez_systems.multifile_upload.fallback_content_type:
        content_type_identifier: file
        content_field_identifier: file
        name_field_identifier: name

```
