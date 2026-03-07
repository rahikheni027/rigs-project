package com.rigs.rigs;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RigsApplication {

    public static void main(String[] args) {
        SpringApplication.run(RigsApplication.class, args);
    }
}
