package com.memorio.backend.faces;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;

import java.sql.Types;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "face_images")
public class FaceImage {
    @Id
    @UuidGenerator
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    @Column(name = "filename", nullable = false, length = 150)
    private String filename;

    //@Lob
    @JdbcTypeCode(Types.VARBINARY)
    @Column(name = "image_data", nullable = false, columnDefinition = "bytea")
    private byte[] imageData;


    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private long fileSize;

    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;

    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary = false;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    public FaceImage(){}

    public FaceImage(Person person, String filename, byte[] imageData,
                     String contentType){
        this.person = person;
        this.filename = filename;
        this.imageData = imageData;
        this.contentType = contentType;
        this.fileSize = imageData != null ? imageData.length : 0;
    }

    public UUID getId(){return id;}
    public void setId(UUID id){
        this.id = id;
    }

    public Person getPerson(){
        return person;
    }
    public void setPerson(Person person){
        this.person = person;
    }

    public String getFilename(){return filename;}
    public void setFilename(String filename){
        this.filename = filename;
    }
    public byte[] getImageData(){return imageData;}
    public void setImageData(byte[] imageData){
        this.imageData = imageData;
        this.fileSize = imageData != null ? imageData.length : 0;

    }
    public String getContentType(){return contentType;}
    public void setContentType(String contentType){
        this.contentType = contentType;
    }

    public long getFileSize(){return fileSize;}
    public void setFileSize(long fileSize){
        this.fileSize = fileSize;
    }
    public Integer getWidth(){
        return width;
    }
    public void setWidth(Integer width){
        this.width = width;
    }

    public Integer getHeight(){return height;}
    public void setHeight(Integer height){
        this.height = height;
    }

    public boolean isPrimary(){return isPrimary;}
    public void setPrimary(boolean primary){
        isPrimary = primary;
    }
    public OffsetDateTime getCreatedAt(){return createdAt;}
    public OffsetDateTime getUpdatedAt(){return updatedAt;}
}
