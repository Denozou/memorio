package com.memorio.backend.faces;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
@Repository
public interface FaceImageRepository extends JpaRepository<FaceImage, UUID> {

    List<FaceImage> findByPersonId(UUID personId);
    @Query("SELECT fi FROM FaceImage fi WHERE fi.person.personName = :personName")
    List<FaceImage> findByPersonName(@Param("personName") String personName);

    Optional<FaceImage>findByPersonIdAndIsPrimaryTrue(UUID personId);
    @Query("SELECT fi FROM FaceImage fi WHERE fi.person.personName = :personName AND fi.filename = :filename")
    Optional<FaceImage> findByPersonNameAndFilename(@Param("personName") String personName,
                                                    @Param("filename") String filename);
    @Query(value = "SELECT * FROM face_images WHERE person_id = :personId ORDER BY RANDOM() LIMIT 1",
        nativeQuery = true)
    Optional<FaceImage> findRandomImageByPersonId(@Param("personId") UUID personId);

    long countByPersonId(UUID personId);

    void deleteByPersonId(UUID personId);
}
