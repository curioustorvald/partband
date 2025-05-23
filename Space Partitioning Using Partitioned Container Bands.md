# Space Partitioning Using Partitioned Container Bands

# Abstract

This algorithm provides a quick solution to pseudo-mosaic rectangle layout useful for image gallery applications, using a concept of Container Bands and their partitioning with a predefined set of rules.

# Band-oriented Space Partitioning

Non-grid partitioning has been always a tricky puzzle in the field of Computer Science and the Aesthetics, especially in a context of creating a web page of image gallery which must rely on automated solutions for interoperability with all devices.

This article suggests a simple good-enough approach to this problem using Container Bands and their partitioning.

## Partitioning a Container Band

The proposed image gallery is consists of a stack of Container Bands, which are partitioned using one of the defined presets.

| **Page** |
| --- |
| Container band #1 |
| Container band #2 |
| Container band #3 |
| … |

### Prerequisites

- The container is wider than the widest image one wants to display

### Container Band Partitioning Rules

Note that the partition between Panel A and the other panel group is always adjustable

- Two-row Standard/Wide Aspect Ratio
    
    
    Type A
    
    | A | B |
    | --- | --- |
    | A | B |
    
    Type B (adjustable B-C)
    
    | A | B |
    | --- | --- |
    | A | C |
- Three-row Standard Aspect Ratio
    
    
    Type C (adjustable B-C)
    
    | A | B |
    | --- | --- |
    | A | C |
    | A | C |
    
    Type D (adjustable B-C, C-D)
    
    | A | B |
    | --- | --- |
    | A | C |
    | A | D |
- Two-row Tall Aspect Ratio
    
    
    Type E1 (adjustable B-D, C-E, then BD-CE)
    
    | A | B | C |
    | --- | --- | --- |
    | A | D | E |
    
    Type E2 (adjustable B-C, D-E, then BC-DE)
    
    | A | B | C |
    | --- | --- | --- |
    | A | D | E |
    
    Type H (adjustable B-D)
    
    | A | B | B |
    | --- | --- | --- |
    | A | D | D |
    
    Type F (adjustable D-E, then B-DE)
    
    | A | B | B |
    | --- | --- | --- |
    | A | D | E |
    
    Type G (adjustable B-D, then BD-C)
    
    | A | B | C |
    | --- | --- | --- |
    | A | D | C |
    
    Type I (adjustable B-C)
    
    | A | B | C |
    | --- | --- | --- |
    | A | B | C |

## Procedure of Operation

### Prerequisites

- The images have known width and height
- The images are tagged with their “importance value” — images with high “importance value” will get larger area
- The images are placed in two bins: important and lesser bin
- Bins are shuffled to avoid always selecting the image with the highest “importance value” first

### Procedure

1. Create a working Container Band
2. Choose the image from the “important bin”
    a. If the “important bin” is empty, choose from the other bin
3. Choose an appropriate partitioning rule according to the aspect ratio of the chosen image, and prepare the working Container Band using the rule
    a. When two or more rules are applicable, choose randomly
4. Place the chosen image onto the main area (**Panel A** of the partitioning), then remove the chosen image from the bin
5. Fill in the remaining areas using a bin of lesser images
    a. Choose an image whose aspect ratio closely matches that of the target panel. e.g. if the area is vertically tall, choose the image that is also vertically tall
    b. If there is at least one area that cannot be filled because no viable less important image of matching aspect ratio is available, and the current container band is **not likely** the last band (count the remaining images on the bins) — bail out (undo any removal committed to the bin and the band partitioning), go to step 3.a. and choose different rules
6. Adjust the partitioning using the adjustable “handle” defined on the partitioning rule to achieve lowest root-mean-squared error of aspect ratios
7. Insert the finished Container Band to the appropriate HTML element
8. Repeat the procedure until all image bins are exhausted

### Notes on Applying Rules

- The actual aspect ratio of the panels can be shorter/narrower than the actual aspect ratio of the image to achieve better fit
