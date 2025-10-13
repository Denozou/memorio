package com.memorio.backend.faces;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;


@Entity
@Table(name = "persons")
public class Person {
    @Id
    @UuidGenerator
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "person_name", nullable = false, unique = true, length = 100)
    private String personName;
    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;
    @Column(name = "difficulty_level", nullable = false)
    private int difficultyLevel = 1;
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
    @OneToMany(mappedBy = "person", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<FaceImage> faceImages = new ArrayList<>();
    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;
    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    public Person(){
    }

    public Person(String personName, String displayName, int difficultyLevel){
        this.personName = personName;
        this.displayName = displayName;
        this.difficultyLevel = difficultyLevel;
    }

    public UUID getId(){ return id;}
    public void setId(UUID id){
        this.id = id;
    }
    public String getPersonName(){return personName;}
    public void setPersonName(String personName){
        this.personName = personName;
    }

    public String getDisplayName(){return displayName;}
    public void setDisplayName(String displayName){
        this.displayName = displayName;
    }

    public int getDifficultyLevel(){return difficultyLevel;}
    public void setDifficultyLevel(int difficultyLevel){
        this.difficultyLevel = difficultyLevel;
    }

    public boolean isActive(){return isActive;}
    public void setActive(boolean active){
        this.isActive = active;
    }

    public List<FaceImage>getFaceImages(){return faceImages;}
    public void setFaceImages(List<FaceImage> faceImages){
        this.faceImages = faceImages;
    }

    public OffsetDateTime getCreatedAt(){return createdAt;}
    public OffsetDateTime getUpdatedAt(){return  updatedAt;}


    public void addFaceImage(FaceImage faceImage){
        faceImages.add(faceImage);
        faceImage.setPerson(this);
    }

    public void removeFaceImage(FaceImage faceImage){
        faceImages.remove(faceImage);
        faceImage.setPerson(null);
    }
}
