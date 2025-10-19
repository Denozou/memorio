package com.memorio.backend.exercise.dto;

import java.util.List;
public class HistoryResponse {

    private final List<HistoryItem> items;
    private final int limit;
    private final int offset;
    private final long total;

    public HistoryResponse(List<HistoryItem> items, int limit, int offset, long total){
        this.items = items != null ? items : List.of();
        this.limit = limit;
        this.offset = offset;
        this.total = total;
    }

    public List<HistoryItem> getItems(){return items;}
    public int getLimit(){return limit;}
    public int getOffset(){return offset;}
    public long getTotal(){return total;}

}
