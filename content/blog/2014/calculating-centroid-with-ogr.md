---
title: Calculating Polygon Centroid with OGR
summary: A simple recipe for calculating the centroid values for polygon features.
date: 2014-11-30
authors:
  - name: diegoripley
    link: https://github.com/diegoripley
    image: https://github.com/diegoripley.png
tags:
  - python
excludeSearch: false
---

A simple recipe for calculating the centroid values for polygon features. 

```python
from collections import OrderedDict
import ogr


def calculate_centroid(spatial_file, unique_field):
    """
    :param spatial_file: The path of the spatial file.
    :param unique_field: The unique id to use as a key for
    our dictionary.
    :return: Ordered dictionary of the centroid of features
    (longitude, latitude).
    """
    data_source = ogr.Open(spatial_file)
    layer = data_source.GetLayerByIndex(0)

    feature_centroids = OrderedDict()
    for feature in layer:
        geom = feature.GetGeometryRef()
        unique_identifier = feature.GetField(unique_field)

        # If multipart, get centroid from the part with largest area.
        if geom.GetGeometryName() == 'MULTIPOLYGON':
            parts = []
            for part in geom:
                centroid = part.Centroid()
                parts.append(((centroid.GetX(),
                               centroid.GetY()),
                              part.Area()))

            # Choose centroid from largest multipart feature.
            parts = max(parts, key=lambda x: x[1])
            centroid = parts[0]
        else:
            centroid = geom.Centroid()
            centroid = (centroid.GetX(), centroid.GetY())

        feature_centroids[unique_identifier] = centroid

    return feature_centroids

calculate_centroid('filename.geojson', 'field')
```