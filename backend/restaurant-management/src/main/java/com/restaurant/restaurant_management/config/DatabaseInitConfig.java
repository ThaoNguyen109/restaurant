package com.restaurant.restaurant_management.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Configuration
public class DatabaseInitConfig {

    @Value("${app.mysql.database-name:restaurant_management}")
    private String databaseName;

    @Bean
    public CommandLineRunner createDatabaseIfNotExists(DataSource dataSource) {
        return args -> {
            try (Connection connection = dataSource.getConnection();
                 Statement statement = connection.createStatement()) {
                statement.executeUpdate("CREATE DATABASE IF NOT EXISTS `" + databaseName + "`");
                System.out.println("Database ready: " + databaseName);
            } catch (Exception ex) {
                System.err.println("Unable to create database automatically: " + ex.getMessage());
                throw ex;
            }
        };
    }
}
