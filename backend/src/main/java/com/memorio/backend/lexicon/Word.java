package com.memorio.backend.lexicon;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
@Entity
@Table(name = "words", indexes = {
        @Index(name = "idx_words_lang_text", columnList = "language, text"),
        @Index(name = "idx_words_lang_rank", columnList = "language, freq_rank"),

})
public class Word {

    @Id
    private UUID Id;
    @Column (nullable = false, length = 8)
    private String language;
    @Column(nullable = false, length = 128)
    private String text;
    @Column(length = 128)
    private String lemma;
    @Column (length = 16)
    private String pos;
    @Column(name = "freq_rank")
    private Integer freqRank;
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected Word(){}

    public Word(UUID Id, String language, String text, String lemma,
                String pos, Integer freqRank, OffsetDateTime createdAt){
        this.Id = Id;
        this.language = language;
        this.text = text;
        this.lemma = lemma;
        this.pos = pos;
        this.freqRank = freqRank;
        this.createdAt = createdAt;
    }

    public UUID getId(){return Id;}
    public String getLanguage(){return language;}
    public String getText(){return text;}
    public String getLemma(){return lemma;}
    public String getPos(){return pos;}
    public Integer getFreqRank(){return freqRank;}
    public OffsetDateTime getCreatedAt(){return createdAt;}

}
